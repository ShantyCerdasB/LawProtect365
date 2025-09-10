/**
 * @file CompleteSigning.Controller.ts
 * @summary Complete Signing controller
 * @description Handles signing completion requests
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { SigningCommandService } from "../../../app/services/Signing";
import { CompleteSigningBody } from "../../../presentation/schemas/signing/CompleteSigning.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { CompleteSigningControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { CompleteSigningResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Complete Signing controller
 */
export const CompleteSigningController = createCommandController<CompleteSigningControllerInput, CompleteSigningResult>({
  bodySchema: CompleteSigningBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: SigningCommandService,
  createDependencies: (c: any) => c.signing.command, // Use the service from container
  extractParams: (path: any, body: any, context: any) => ({
    envelopeId: path.id,
    signerId: body.signerId,
    digest: body.digest,
    algorithm: body.algorithm,
    keyId: body.keyId,
    token: "", // Will be injected by factory
    actorEmail: context?.actor?.email, // Add auth context
    ip: context?.identity?.sourceIp, // IP for security validation
    userAgent: context?.identity?.userAgent // User Agent for security validation
  }),
  responseType: "ok",
  includeActor: true, // Enable auth validation
  methodName: "completeSigning"});

// Export handler for backward compatibility
export const handler = CompleteSigningController;

