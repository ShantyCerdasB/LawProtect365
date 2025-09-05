/**
 * @file InviteParties.Controller.ts
 * @summary Invite Parties controller
 * @description Handles inviting parties to sign an envelope
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { InvitationsBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { InvitePartiesControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { InvitePartiesAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Invite Parties controller
 */
export const InvitePartiesController = createCommandController<InvitePartiesControllerInput, InvitePartiesAppResult>({
  bodySchema: InvitationsBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultRequestsCommandService,
  createDependencies: (c) => makeRequestsCommandsPort({
    repositories: {
      envelopes: c.repos.envelopes,
      parties: c.repos.parties,
      inputs: c.repos.inputs
    },
    services: {
      validation: c.requests.validationService,
      audit: c.requests.auditService,
      event: c.requests.eventService,
      rateLimit: c.requests.rateLimitService
    },
    infrastructure: {
      ids: c.ids,
      s3Presigner: c.storage.presigner
    }
  }),
  extractParams: (path, body) => ({
    envelopeId: path.id,
    partyIds: body.partyIds,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = InvitePartiesController;
