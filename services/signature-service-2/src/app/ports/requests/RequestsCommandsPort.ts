/**
 * @file RequestsCommandsPort.ts
 * @summary Port for request command operations.
 * @description Defines the interface for write operations on envelope requests.
 * This port provides methods to handle invitation, reminder, cancellation, and other request operations.
 */

import type { EnvelopeId, PartyId } from "../../../domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";
/**
 * @description Command for inviting parties to sign an envelope.
 */
export interface InvitePartiesCommand {
  /** The envelope ID to invite parties to */
  envelopeId: EnvelopeId;
  /** Array of party IDs to invite */
  partyIds: PartyId[];
  /** Optional custom message to include in the invitation email */
  message?: string;
  /** Optional deadline for signing (ISO 8601 date string) */
  signByDate?: string;
  /** Optional signing order preference - only applies when multiple parties are invited */
  signingOrder?: "owner_first" | "invitees_first";
  /** Input information from Documents Service */
  inputs: {
    /** Whether the envelope has inputs */
    hasInputs: boolean;
    /** Total number of inputs */
    inputCount: number;
    /** Number of signature inputs */
    signatureInputs: number;
    /** Email addresses of assigned signers */
    assignedSigners: string[];
  };
  /** Context information about the actor (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of inviting parties to an envelope.
 */
export interface InvitePartiesResult {
  /** Array of party IDs that were successfully invited */
  invited: PartyId[];
  /** Array of party IDs that were already pending */
  alreadyPending: PartyId[];
  /** Array of party IDs that were skipped due to rate limiting or other reasons */
  skipped: PartyId[];
  /** Whether the envelope status was changed to 'sent' */
  statusChanged: boolean;
  /** Array of invitation tokens created for the invited parties */
  tokens: string[];
}

/**
 * @description Command for sending reminders to parties.
 */
export interface RemindPartiesCommand {
  /** The envelope ID to send reminders for */
  envelopeId: EnvelopeId;
  /** Optional array of specific party IDs to remind */
  partyIds?: PartyId[];
  /** Optional custom message for the reminder */
  message?: string;
  /** Context information about the actor (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of sending reminders to parties.
 */
export interface RemindPartiesResult {
  /** Array of party IDs that were successfully reminded */
  reminded: PartyId[];
  /** Array of party IDs that were skipped */
  skipped: PartyId[];
}

/**
 * @description Command for canceling an envelope.
 */
export interface CancelEnvelopeCommand {
  /** The envelope ID to cancel */
  envelopeId: EnvelopeId;
  /** Optional reason for cancellation */
  reason?: string;
  /** Context information about the actor (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of canceling an envelope.
 */
export interface CancelEnvelopeResult {
  /** The envelope ID that was canceled */
  envelopeId: EnvelopeId;
  /** The new status of the envelope */
  status: string;
  /** Timestamp when the envelope was canceled */
  canceledAt: string;
}

/**
 * @description Command for declining an envelope.
 */
export interface DeclineEnvelopeCommand {
  /** The envelope ID to decline */
  envelopeId: EnvelopeId;
  /** Optional reason for decline */
  reason?: string;
  /** Context information about the actor (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of declining an envelope.
 */
export interface DeclineEnvelopeResult {
  /** The envelope ID that was declined */
  envelopeId: EnvelopeId;
  /** The new status of the envelope */
  status: string;
  /** Timestamp when the envelope was declined */
  declinedAt: string;
}

/**
 * @description Command for finalizing an envelope.
 */
export interface FinaliseEnvelopeCommand {
  /** The envelope ID to finalize */
  envelopeId: EnvelopeId;
  /** Optional message for finalization */
  message?: string;
  /** Input information from Documents Service */
  inputs: {
    /** Whether the envelope has inputs */
    hasInputs: boolean;
    /** Total number of inputs */
    inputCount: number;
  };
  /** Context information about the actor (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of finalizing an envelope.
 */
export interface FinaliseEnvelopeResult {
  /** The envelope ID that was finalized */
  envelopeId: EnvelopeId;
  /** Array of generated artifact IDs (certificates, PDFs, etc.) */
  artifactIds: string[];
  /** Timestamp when the envelope was finalized */
  finalizedAt: string;
}

/**
 * @description Command for requesting a signature from a specific party.
 */
export interface RequestSignatureCommand {
  /** The envelope ID to request signature for */
  envelopeId: EnvelopeId;
  /** The party ID to request signature from */
  partyId: PartyId;
  /** Optional custom message for the signature request */
  message?: string;
  /** Optional channel for sending the request (email, sms) */
  channel?: "email" | "sms";
  /** Context information about the actor (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of requesting a signature.
 */
export interface RequestSignatureResult {
  /** The party ID that was requested to sign */
  partyId: PartyId;
  /** The signing URL generated for the party */
  signingUrl: string;
  /** When the signing URL expires */
  expiresAt: string;
  /** Whether the envelope status was changed to 'sent' */
  statusChanged: boolean;
}

/**
 * @description Command for adding a viewer to an envelope.
 */
export interface AddViewerCommand {
  /** The envelope ID to add the viewer to */
  envelopeId: EnvelopeId;
  /** Email address of the viewer */
  email: string;
  /** Optional name of the viewer */
  name?: string;
  /** Optional locale preference for the viewer */
  locale?: string;
  /** Context information about the actor (optional) */
  actor?: ActorContext;
}

/**
 * @description Result of adding a viewer to an envelope.
 */
export interface AddViewerResult {
  /** The party ID of the newly created viewer */
  partyId: PartyId;
  /** The email address of the viewer */
  email: string;
  /** Timestamp when the viewer was added */
  addedAt: string;
}

/**
 * @description Port interface for request command operations.
 * 
 * This port defines the contract for write operations on envelope requests.
 * Implementations should handle business logic validation and event emission.
 */
export interface RequestsCommandsPort {
  /**
   * @summary Invites parties to sign an envelope
   * @description Invites parties to sign an envelope with validation and rate limiting
   * @param command - The invitation command with required data
   * @returns Promise resolving to invitation result
   */
  inviteParties(command: InvitePartiesCommand): Promise<InvitePartiesResult>;

  /**
   * @summary Sends reminders to parties for an envelope
   * @description Sends reminders to parties for an envelope with rate limiting
   * @param command - The reminder command with required data
   * @returns Promise resolving to reminder result
   */
  remindParties(command: RemindPartiesCommand): Promise<RemindPartiesResult>;

  /**
   * @summary Cancels an envelope
   * @description Cancels an envelope with proper status updates
   * @param command - The cancellation command with required data
   * @returns Promise resolving to cancellation result
   */
  cancelEnvelope(command: CancelEnvelopeCommand): Promise<CancelEnvelopeResult>;

  /**
   * @summary Declines an envelope
   * @description Declines an envelope with proper status updates
   * @param command - The decline command with required data
   * @returns Promise resolving to decline result
   */
  declineEnvelope(command: DeclineEnvelopeCommand): Promise<DeclineEnvelopeResult>;

  /**
   * @summary Finalizes a completed envelope
   * @description Finalizes a completed envelope and generates artifacts
   * @param command - The finalization command with required data
   * @returns Promise resolving to finalization result
   */
  finaliseEnvelope(command: FinaliseEnvelopeCommand): Promise<FinaliseEnvelopeResult>;

  /**
   * @summary Requests a signature from a specific party
   * @description Requests a signature from a specific party with URL generation
   * @param command - The signature request command with required data
   * @returns Promise resolving to signature request result
   */
  requestSignature(command: RequestSignatureCommand): Promise<RequestSignatureResult>;

  /**
   * @summary Adds a viewer to an envelope
   * @description Adds a viewer to an envelope with proper party creation
   * @param command - The add viewer command with required data
   * @returns Promise resolving to add viewer result
   */
  addViewer(command: AddViewerCommand): Promise<AddViewerResult>;
};
