/**
 * @file PrepareSigning.Controller.ts
 * @summary Prepare Signing controller
 * @description Handles signing preparation operations
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeSigningCommandsPort } from "../../../app/adapters/signing/makeSigningCommandsPort";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { PrepareSigningBody } from "../../../presentation/schemas/signing/PrepareSigning.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { PrepareSigningControllerInput } from "../../../shared/types/signing/ControllerInputs";
import type { PrepareSigningResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Prepare Signing controller
 */
export const PrepareSigningController = createCommandController<PrepareSigningControllerInput, PrepareSigningResult>({
  bodySchema: PrepareSigningBody,
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
      s3Service: c.services.signingS3,
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
    signerId: body.signerId,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = PrepareSigningController;
