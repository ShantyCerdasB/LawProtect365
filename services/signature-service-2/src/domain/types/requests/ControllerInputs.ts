/**
 * @file ControllerInputs.ts
 * @summary Inputs for request controllers
 * @description Defines the input contracts for request controllers, and actor are injected by the factory
 */

import type { EnvelopeId, PartyId } from "@/domain/value-objects/index";
import type { ActorContext } from "@lawprotect/shared-ts";

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * @summary Base input for all request controllers
 * @description Common fields for request operations
 */
export interface BaseRequestControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Actor context for authentication and audit */
  readonly actor: ActorContext;
}

/**
 * @summary Input with party IDs
 * @description Base input plus party identifiers
 */
export interface RequestWithPartiesControllerInput extends BaseRequestControllerInput {
  /** Array of party IDs */
  readonly partyIds: PartyId[];
  /** Optional custom message for invitations/reminders */
  readonly message?: string;
  /** Optional deadline for signing (ISO 8601 date string) */
  readonly signByDate?: string;
  /** Optional signing order preference - only applies when multiple parties are invited */
  readonly signingOrder?: "owner_first" | "invitees_first";
}

// ============================================================================
// INVITE PARTIES
// ============================================================================

/**
 * @summary Input for inviting parties (controller level)
 * @description Parameters for inviting parties to sign an envelope, and actor are injected by factory
 */
export interface InvitePartiesControllerInput extends RequestWithPartiesControllerInput {
  /** Input information from Documents Service */
  readonly inputs: {
    /** Whether the envelope has inputs */
    readonly hasInputs: boolean;
    /** Total number of inputs */
    readonly inputCount: number;
    /** Number of signature inputs */
    readonly signatureInputs: number;
    /** Email addresses of assigned signers */
    readonly assignedSigners: string[];
  };
}

// ============================================================================
// REMIND PARTIES
// ============================================================================

/**
 * @summary Input for reminding parties (controller level)
 * @description Parameters for sending reminders to parties, and actor are injected by factory
 */
export interface RemindPartiesControllerInput extends BaseRequestControllerInput {
  /** Optional array of specific party IDs to remind */
  readonly partyIds?: PartyId[];
  /** Optional custom message for the reminder */
  readonly message?: string;
}

// ============================================================================
// CANCEL ENVELOPE
// ============================================================================

/**
 * @summary Input for canceling an envelope (controller level)
 * @description Parameters for canceling an envelope, and actor are injected by factory
 */
export interface CancelEnvelopeControllerInput extends BaseRequestControllerInput {
  /** Optional reason for cancellation */
  readonly reason?: string;
}

// ============================================================================
// DECLINE ENVELOPE
// ============================================================================

/**
 * @summary Input for declining an envelope (controller level)
 * @description Parameters for declining an envelope, and actor are injected by factory
 */
export interface DeclineEnvelopeControllerInput extends BaseRequestControllerInput {
  /** Optional reason for declining */
  readonly reason?: string;
}

// ============================================================================
// FINALISE ENVELOPE
// ============================================================================

/**
 * @summary Input for finalizing an envelope (controller level)
 * @description Parameters for finalizing an envelope, and actor are injected by factory
 */
export interface FinaliseEnvelopeControllerInput extends BaseRequestControllerInput {
  /** Optional message for finalization */
  readonly message?: string;
  /** Input information from Documents Service */
  readonly inputs: {
    /** Whether the envelope has inputs */
    readonly hasInputs: boolean;
    /** Total number of inputs */
    readonly inputCount: number;
  };
}

// ============================================================================
// REQUEST SIGNATURE
// ============================================================================

/**
 * @summary Input for requesting signature (controller level)
 * @description Parameters for requesting signature from a specific party, and actor are injected by factory
 */
export interface RequestSignatureControllerInput extends BaseRequestControllerInput {
  /** The party ID to request signature from */
  readonly partyId: PartyId;
  /** Optional custom message for the signature request */
  readonly message?: string;
}

// ============================================================================
// ADD VIEWER
// ============================================================================

/**
 * @summary Input for adding a viewer (controller level)
 * @description Parameters for adding a viewer to an envelope, and actor are injected by factory
 */
export interface AddViewerControllerInput extends BaseRequestControllerInput {
  /** Email address of the viewer */
  readonly email: string;
  /** Optional name of the viewer */
  readonly name?: string;
  /** Optional locale preference for the viewer */
  readonly locale?: string;
}

