/**
 * @file DownloadSignedDocument.Controller.ts
 * @summary Download Signed Document controller
 * @description Handles signed document download requests
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeSigningCommandsPort } from "../../../app/adapters/signing/makeSigningCommandsPort";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { DownloadSignedDocumentBody } from "../../../presentation/schemas/signing/DownloadSignedDocument.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { DownloadSignedDocumentControllerInput } from "../../../shared/types/signing/ControllerInputs";
import type { DownloadSignedDocumentResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Download Signed Document controller
 */
export const DownloadSignedDocumentController = createCommandController<DownloadSignedDocumentControllerInput, DownloadSignedDocumentResult>({
  bodySchema: DownloadSignedDocumentBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultSigningCommandService,
  createDependencies: (c) => makeSigningCommandsPort(
    c.repos.envelopes,
    c.repos.parties,
    {
      events: c.events.publisher,
      ids: c.ids,
      time: c.time,
      rateLimit: c.rateLimitStore,
      signer: c.crypto.signer,
      idempotency: c.idempotency.runner,
      signingConfig: {
        defaultKeyId: c.config.kms.signerKeyId,
        allowedAlgorithms: [c.config.kms.signingAlgorithm],
      },
      uploadConfig: {
        uploadBucket: c.config.s3.evidenceBucket,
        uploadTtlSeconds: c.config.s3.presignTtlSeconds,
      },
      downloadConfig: {
        signedBucket: c.config.s3.signedBucket,
        downloadTtlSeconds: c.config.s3.presignTtlSeconds,
      },
    }
  ),
  extractParams: (path, body) => ({
    tenantId: path.tenantId,
    envelopeId: path.id,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = DownloadSignedDocumentController;
