/**
 * @file invite.ts
 * @summary Invite parties controller
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
 * @description Invite parties controller
 */
export const InvitePartiesController = createCommandController<InvitePartiesControllerInput, InvitePartiesAppResult>({
  bodySchema: InvitationsBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultRequestsCommandService,
  createDependencies: (c) => makeRequestsCommandsPort(
    c.repos.envelopes,
    c.repos.parties,
    c.repos.inputs,
    c.requests.validationService,
    c.requests.auditService,
    c.requests.eventService,
    c.requests.rateLimitService
  ),
  extractParams: (path, body) => ({
    envelopeId: path.id,
    partyIds: body.partyIds,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = InvitePartiesController;
