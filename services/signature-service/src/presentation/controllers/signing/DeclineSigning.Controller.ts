/**
 * @file DeclineSigning.Controller.ts
 * @summary Decline Signing controller
 * @description Handles signing decline requests
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeSigningCommandsPort } from "../../../app/adapters/signing/makeSigningCommandsPort";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { DeclineSigningBody } from "../../../presentation/schemas/signing/DeclineSigning.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { DeclineSigningControllerInput } from "../../../shared/types/signing/ControllerInputs";
import type { DeclineSigningResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Decline Signing controller
 */
export const DeclineSigningController = createCommandController<DeclineSigningControllerInput, DeclineSigningResult>({
  bodySchema: DeclineSigningBody,
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
    reason: body.reason,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = DeclineSigningController;
