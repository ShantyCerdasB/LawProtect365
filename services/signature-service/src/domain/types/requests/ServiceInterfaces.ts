/**
 * @file ServiceInterfaces.ts
 * @summary Service interfaces for Requests module
 * @description Defines all service interfaces used by Requests services
 */

import type { ActorContext } from "@lawprotect/shared-ts";
import type { EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { 
  InvitePartiesCommand,
  RemindPartiesCommand,
  CancelEnvelopeCommand,
  DeclineEnvelopeCommand,
  FinaliseEnvelopeCommand,
  RequestSignatureCommand,
  AddViewerCommand
} from "../../../app/ports/requests/RequestsCommandsPort";

/**
 * @description Validation service for Requests operations
 */
export interface RequestsValidationService {
  /**
   * Validates invite parties input
   */
  validateInviteParties(input: InvitePartiesCommand): void;

  /**
   * Validates remind parties input
   */
  validateRemindParties(input: RemindPartiesCommand): void;

  /**
   * Validates cancel envelope input
   */
  validateCancelEnvelope(input: CancelEnvelopeCommand): void;

  /**
   * Validates decline envelope input
   */
  validateDeclineEnvelope(input: DeclineEnvelopeCommand): void;

  /**
   * Validates finalise envelope input
   */
  validateFinaliseEnvelope(input: FinaliseEnvelopeCommand): void;

  /**
   * Validates request signature input
   */
  validateRequestSignature(input: RequestSignatureCommand): void;

  /**
   * Validates add viewer input
   */
  validateAddViewer(input: AddViewerCommand): void;
}

/**
 * @description Audit service for Requests operations
 */
export interface RequestsAuditService {
  /**
   * Logs invite parties operation
   */
  logInviteParties(partyIds: PartyId[], envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Logs remind parties operation
   */
  logRemindParties(partyIds: PartyId[], envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Logs cancel envelope operation
   */
  logCancelEnvelope(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Logs decline envelope operation
   */
  logDeclineEnvelope(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Logs finalise envelope operation
   */
  logFinaliseEnvelope(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Logs request signature operation
   */
  logRequestSignature(partyId: PartyId, envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Logs add viewer operation
   */
  logAddViewer(partyId: PartyId, envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;
}

/**
 * @description Event service for Requests operations
 */
export interface RequestsEventService {
  /**
   * Publishes invite parties event
   */
  publishInviteParties(partyIds: PartyId[], envelopeId: EnvelopeId,  actor: ActorContext): Promise<void>;

  /**
   * Publishes remind parties event
   */
  publishRemindParties(partyIds: PartyId[], envelopeId: EnvelopeId,  actor: ActorContext): Promise<void>;

  /**
   * Publishes cancel envelope event
   */
  publishCancelEnvelope(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Publishes decline envelope event
   */
  publishDeclineEnvelope(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Publishes finalise envelope event
   */
  publishFinaliseEnvelope(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Publishes request signature event
   */
  publishRequestSignature(partyId: PartyId, envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Publishes add viewer event
   */
  publishAddViewer(partyId: PartyId, envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;
}

/**
 * @description Rate limit service for Requests operations
 */
export interface RequestsRateLimitService {
  /**
   * Checks rate limit for invite operations
   */
  checkInviteLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Checks rate limit for remind operations
   */
  checkRemindLimit(envelopeId: EnvelopeId, partyId: PartyId, actor: ActorContext): Promise<void>;

  /**
   * Checks rate limit for cancel operations
   */
  checkCancelLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Checks rate limit for decline operations
   */
  checkDeclineLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Checks rate limit for finalise operations
   */
  checkFinaliseLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;

  /**
   * Checks rate limit for request signature operations
   */
  checkRequestSignatureLimit(envelopeId: EnvelopeId, partyId: PartyId, actor: ActorContext): Promise<void>;

  /**
   * Checks rate limit for add viewer operations
   */
  checkAddViewerLimit(envelopeId: EnvelopeId, actor: ActorContext): Promise<void>;
}

