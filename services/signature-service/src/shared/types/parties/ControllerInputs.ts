/**
 * @file ControllerInputs.ts
 * @summary Inputs for party controllers (without tenantId)
 * @description Defines the input contracts for party controllers, tenantId is injected by the factory
 */

import { PartyRole } from "@/domain/value-objects";
import type { EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";

// ============================================================================
// CREATE PARTY
// ============================================================================

/**
 * @summary Input for creating a party (controller level)
 * @description Parameters for creating a new party, tenantId is injected by factory
 */
export interface CreatePartyControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party name */
  readonly name: string;
  /** Party email address */
  readonly email: string;
  /** Party role in the envelope */
  readonly role: PartyRole;
  /** Optional sequence number for signing order */
  readonly sequence?: number;
}

// ============================================================================
// UPDATE PARTY
// ============================================================================

/**
 * @summary Input for updating a party (controller level)
 * @description Parameters for updating an existing party, tenantId is injected by factory
 */
export interface UpdatePartyControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Optional name update */
  readonly name?: string;
  /** Optional email update */
  readonly email?: string;
  /** Optional role update */
  readonly role?: PartyRole;
  /** Optional sequence update */
  readonly sequence?: number;
}

// ============================================================================
// DELETE PARTY
// ============================================================================

/**
 * @summary Input for deleting a party (controller level)
 * @description Parameters for deleting a party, tenantId is injected by factory
 */
export interface DeletePartyControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier */
  readonly partyId: PartyId;
}
