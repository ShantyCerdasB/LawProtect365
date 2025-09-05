/**
 * @file PresignUpload.Controller.ts
 * @summary Presign Upload controller
 * @description Handles presigned upload URL requests
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeSigningCommandsPort } from "../../../app/adapters/signing/makeSigningCommandsPort";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { PresignUploadBody } from "../../../presentation/schemas/signing/PresignUpload.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { PresignUploadControllerInput } from "../../../shared/types/signing/ControllerInputs";
import type { PresignUploadResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Presign Upload controller
 */
export const PresignUploadController = createCommandController<PresignUploadControllerInput, PresignUploadResult>({
  bodySchema: PresignUploadBody,
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
    filename: body.filename,
    contentType: body.contentType,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = PresignUploadController;
