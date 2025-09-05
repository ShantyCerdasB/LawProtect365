/**
 * @file CompleteSigning.Controller.ts
 * @summary Complete Signing controller
 * @description Handles signing completion requests
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeSigningCommandsPort } from "../../../app/adapters/signing/makeSigningCommandsPort";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { CompleteSigningBody } from "../../../presentation/schemas/signing/CompleteSigning.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { CompleteSigningControllerInput } from "../../../shared/types/signing/ControllerInputs";
import type { CompleteSigningResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Complete Signing controller
 */
export const CompleteSigningController = createCommandController<CompleteSigningControllerInput, CompleteSigningResult>({
  bodySchema: CompleteSigningBody,
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
    signerId: body.signerId,
    digest: body.digest,
    algorithm: body.algorithm,
    keyId: body.keyId,
    otpCode: body.otpCode,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = CompleteSigningController;
