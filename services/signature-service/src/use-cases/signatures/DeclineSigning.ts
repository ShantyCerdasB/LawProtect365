/**
 * @file DeclineSigning.ts
 * @summary Use case to register a signer’s decision to decline.
 *
 * @description
 * Validates the request token, loads the target envelope and party, enforces
 * the domain rule that allows declining from the current envelope state, and
 * persists the party’s declined status. When the repository supports paginated
 * listing, it also evaluates whether all parties are declined and, if so,
 * transitions the envelope to `declined`. Domain events are emitted to support
 * downstream auditing and notifications.
 */

import { nowIso } from "@lawprotect/shared-ts";
import type { Repository, ISODateString } from "@lawprotect/shared-ts";
import type { EventEnvelope } from "@lawprotect/shared-ts";

import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import { assertRequestToken } from "@/domain/rules/Token.rules";
import {
  assertCancelDeclineAllowed,
  assertReasonValid,
} from "@/domain/rules/CancelDecline.rules";
import { envelopeNotFound, partyNotFound, requestTokenInvalid } from "@/errors";
import type { IdempotencyRunner } from "@/adapters/idempotency/IdempotencyRunner";
import type { EventBridgePublisher } from "@/adapters/eventbridge/EventBridgePublisher";
import {
  areAllPartiesDeclined,
  type PartyListRepo,
} from "@/domain/services/PartyStatus.service";

/**
 * Input contract for DeclineSigning.
 */
export interface DeclineSigningInput {
  /** Envelope identifier. */
  envelopeId: string;
  /** Signer/party identifier within the envelope. */
  signerId: string;
  /** Human-readable reason for declining (validated/sanitized). */
  reason: string;
  /** Bearer token issued for the `signing` scope. */
  token: string;
  /** Optional actor metadata for auditing. */
  actor?: {
    ip?: string;
    userAgent?: string;
    locale?: string;
  };
}

/**
 * Output contract for DeclineSigning.
 */
export interface DeclineSigningOutput {
  /** Final party status. */
  status: "declined";
  /** Envelope identifier. */
  envelopeId: string;
  /** Signer/party identifier. */
  signerId: string;
  /** Sanitized decline reason. */
  reason: string;
  /** ISO timestamp when the decline was recorded. */
  declinedAt: string;
}

/**
 * Execution context for DeclineSigning.
 */
export interface DeclineSigningContext {
  repos: {
    /** Envelope repository. */
    envelopes: Repository<Envelope, EnvelopeId>;
    /**
     * Parties repository (composite ID: `{ envelopeId, partyId }`).
     * If it implements `list`, it will be used to determine whether all parties are declined.
     */
    parties: Repository<Party, { envelopeId: string; partyId: string }>;
  };
  /** Event publisher (e.g., EventBridge). */
  events: EventBridgePublisher;
  /** Idempotency runner (optional at this layer). */
  idempotency: IdempotencyRunner;
  /** ID factory. */
  ids: { ulid(): string };
  /** Time source (injectable for testing). */
  time: { now(): number };
}

/**
 * Registers a decline decision for a signer and emits domain events.
 *
 * @throws {AppError} 401 When the request token is invalid or expired.
 * @throws {AppError} 404 When the envelope or party is not found.
 * @throws {AppError} 409 When the envelope state does not allow declining.
 * @throws {AppError} 500 On persistence or event publishing failures.
 */
export const executeDeclineSigning = async (
  input: DeclineSigningInput,
  ctx: DeclineSigningContext
): Promise<DeclineSigningOutput> => {
  try {
    assertRequestToken(input.token, "signing", ctx.time.now());
  } catch (error) {
    throw requestTokenInvalid({ token: input.token, error });
  }

  const envelope = await ctx.repos.envelopes.getById(input.envelopeId as EnvelopeId);
  if (!envelope) {
    throw envelopeNotFound({ envelopeId: input.envelopeId });
  }

  const party = await ctx.repos.parties.getById({
    envelopeId: input.envelopeId,
    partyId: input.signerId,
  });
  if (!party) {
    throw partyNotFound({ envelopeId: input.envelopeId, partyId: input.signerId });
  }

  assertCancelDeclineAllowed(envelope.status);

  const safeReason = assertReasonValid(input.reason);
  const declinedAt = nowIso() as ISODateString;

  await ctx.repos.parties.update(
    { envelopeId: input.envelopeId, partyId: input.signerId },
    { status: "declined" }
  );

  let allDeclined = false;
  const partiesRepoMaybe = ctx.repos.parties as unknown as Partial<PartyListRepo>;
  if (typeof partiesRepoMaybe.list === "function") {
    allDeclined = await areAllPartiesDeclined(
      partiesRepoMaybe as PartyListRepo,
      input.envelopeId,
      input.signerId,
      200
    );
  }

  if (allDeclined) {
    await ctx.repos.envelopes.update(input.envelopeId as EnvelopeId, {
      status: "declined",
      updatedAt: declinedAt,
    });
  }

  const signingDeclinedEvent: EventEnvelope = {
    name: "signing.declined",
    meta: { id: ctx.ids.ulid(), ts: declinedAt, source: "signature-service" },
    data: {
      envelopeId: input.envelopeId,
      signerId: input.signerId,
      reason: safeReason,
      actor: input.actor,
    },
  };
  await ctx.events.publish(signingDeclinedEvent);

  if (allDeclined) {
    const envelopeDeclinedEvent: EventEnvelope = {
      name: "envelope.declined",
      meta: { id: ctx.ids.ulid(), ts: declinedAt, source: "signature-service" },
      data: { envelopeId: input.envelopeId, reason: safeReason, actor: input.actor },
    };
    await ctx.events.publish(envelopeDeclinedEvent);
  }

  return {
    status: "declined",
    envelopeId: input.envelopeId,
    signerId: input.signerId,
    reason: safeReason,
    declinedAt,
  };
};
