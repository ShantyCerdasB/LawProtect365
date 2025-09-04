/**
 * @file CreateConsent.Controller.ts
 * @summary Controller for creating a new consent
 * @description Handles POST /envelopes/:envelopeId/consents requests using command controller factory
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { CreateConsentControllerInput } from "../../../shared/types/consent/ControllerInputs";
import type { CreateConsentAppResult } from "../../../shared/types/consent/AppServiceInputs";
import { CreateConsentPath, CreateConsentBody } from "../../schemas/consents/CreateConsent.schema";
import type { EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";
import type { ConsentType, ConsentStatus } from "../../../domain/values/enums";

export const handler = createCommandController<CreateConsentControllerInput, CreateConsentAppResult>({
  pathSchema: CreateConsentPath,
  bodySchema: CreateConsentBody,
  appServiceClass: ConsentCommandService,
  createDependencies: (c) => makeConsentCommandsPort(
    c.repos.consents, 
    c.repos.delegations, 
    c.ids,
    c.consent.party,
    c.consent.validation,
    c.consent.audit,
    c.consent.events,
    c.idempotency.runner
  ),
  extractParams: (path, body) => ({
    envelopeId: path.envelopeId as EnvelopeId,
    partyId: body.partyId as PartyId,
    type: body.consentType as ConsentType,
    status: "pending" as ConsentStatus,
    metadata: body.metadata,
    expiresAt: body.expiresAt,
    idempotencyKey: body.idempotencyKey,
    ttlSeconds: body.ttlSeconds || 300,
  }),
  responseType: "created",
  includeActor: true,
});
