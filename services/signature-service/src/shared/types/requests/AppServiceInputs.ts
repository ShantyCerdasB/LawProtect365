/**
 * @file AppServiceInputs.ts
 * @summary Input and output types for requests application services
 * @description Defines the input and output contracts for requests application services
 */

import type { TenantId, EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";
import type { 
  InvitePartiesResult,
  RemindPartiesResult,
  CancelEnvelopeResult,
  DeclineEnvelopeResult,
  FinaliseEnvelopeResult,
  RequestSignatureResult,
  AddViewerResult
} from "../../../app/ports/requests/RequestsCommandsPort";

/**
 * @summary Input for invite parties app service
 */
export interface InvitePartiesAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Array of party IDs to invite */
  readonly partyIds: PartyId[];
}

/**
 * @summary Output for invite parties app service
 */
export interface InvitePartiesAppResult {
  /** Invitation result */
  readonly result: InvitePartiesResult;
}

/**
 * @summary Input for remind parties app service
 */
export interface RemindPartiesAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Optional array of specific party IDs to remind */
  readonly partyIds?: PartyId[];
  /** Optional custom message for the reminder */
  readonly message?: string;
}

/**
 * @summary Output for remind parties app service
 */
export interface RemindPartiesAppResult {
  /** Reminder result */
  readonly result: RemindPartiesResult;
}

/**
 * @summary Input for cancel envelope app service
 */
export interface CancelEnvelopeAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Optional reason for cancellation */
  readonly reason?: string;
}

/**
 * @summary Output for cancel envelope app service
 */
export interface CancelEnvelopeAppResult {
  /** Cancellation result */
  readonly result: CancelEnvelopeResult;
}

/**
 * @summary Input for decline envelope app service
 */
export interface DeclineEnvelopeAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Optional reason for decline */
  readonly reason?: string;
}

/**
 * @summary Output for decline envelope app service
 */
export interface DeclineEnvelopeAppResult {
  /** Decline result */
  readonly result: DeclineEnvelopeResult;
}

/**
 * @summary Input for finalise envelope app service
 */
export interface FinaliseEnvelopeAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Optional message for finalization */
  readonly message?: string;
}

/**
 * @summary Output for finalise envelope app service
 */
export interface FinaliseEnvelopeAppResult {
  /** Finalization result */
  readonly result: FinaliseEnvelopeResult;
}

/**
 * @summary Input for request signature app service
 */
export interface RequestSignatureAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier to request signature from */
  readonly partyId: PartyId;
  /** Optional custom message for the signature request */
  readonly message?: string;
  /** Optional channel for sending the request */
  readonly channel?: "email" | "sms";
}

/**
 * @summary Output for request signature app service
 */
export interface RequestSignatureAppResult {
  /** Signature request result */
  readonly result: RequestSignatureResult;
}

/**
 * @summary Input for add viewer app service
 */
export interface AddViewerAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Email address of the viewer */
  readonly email: string;
  /** Optional name of the viewer */
  readonly name?: string;
  /** Optional locale preference for the viewer */
  readonly locale?: string;
}

/**
 * @summary Output for add viewer app service
 */
export interface AddViewerAppResult {
  /** Add viewer result */
  readonly result: AddViewerResult;
}
