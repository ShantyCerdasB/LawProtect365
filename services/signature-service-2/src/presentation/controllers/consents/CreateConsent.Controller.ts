/**
 * @file CreateConsent.Controller.ts
 * @summary Controller for creating a new consent
 * @description Handles POST /envelopes/:envelopeId/consents requests using command controller factory
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { CreateConsentControllerInput } from "../../../domain/types/consent/ControllerInputs";
import type { CreateConsentAppResult } from "../../../domain/types/consent/AppServiceInputs";
import { CreateConsentPath, CreateConsentBody } from "../../schemas/consents/CreateConsent.schema";
import type { EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { ConsentType, ConsentStatus } from "../../../domain/values/enums";
import { createConsentDependencies } from "../../../shared/controllers/helpers";
// Note: Rate limiting would need proper store integration

export const handler = createCommandController<CreateConsentControllerInput, CreateConsentAppResult>({
  pathSchema: CreateConsentPath,
  bodySchema: CreateConsentBody,
  appServiceClass: ConsentCommandService,
  createDependencies: (c: any) => makeConsentCommandsPort(createConsentDependencies(c)),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.envelopeId as EnvelopeId,
    partyId: body.partyId as PartyId,
    type: body.consentType as ConsentType,
    status: "pending" as ConsentStatus,
    metadata: body.metadata,
    expiresAt: body.expiresAt,
    idempotencyKey: body.idempotencyKey,
    ttlSeconds: body.ttlSeconds || 300}),
  // Note: Middleware for rate limiting would need proper store integration
  responseType: "created",
  includeActor: true});

