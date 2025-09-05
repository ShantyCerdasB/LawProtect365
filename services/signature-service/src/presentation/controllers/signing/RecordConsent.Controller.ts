/**
 * @file RecordConsent.Controller.ts
 * @summary Record Consent controller
 * @description Handles signing consent recording requests
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeSigningCommandsPort } from "../../../app/adapters/signing/makeSigningCommandsPort";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { SigningConsentBody } from "../../../presentation/schemas/signing/SigningConsent.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { SigningConsentControllerInput } from "../../../shared/types/signing/ControllerInputs";
import type { SigningConsentResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Record Consent controller
 */
export const RecordConsentController = createCommandController<SigningConsentControllerInput, SigningConsentResult>({
  bodySchema: SigningConsentBody,
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
export const handler = RecordConsentController;
