
/**
 * @file EnvelopeLifecycle.rules.ts
 * @summary Domain rules for envelope lifecycle transitions
 * @description Validates envelope state transitions and draft requirements
 * for structural mutations in the envelope lifecycle.
 */

import type { Envelope } from "../entities";
import { EnvelopeStatusSchema, type EnvelopeStatus } from "@/domain/value-objects/index";
import { ConflictError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * Validates a lifecycle transition for envelopes.
 *
 * Allowed path:
 *   draft → sent → (completed | cancelled | declined)
 *
 * Rules:
 * - No backward transitions.
 * - No side branches.
 * - Staying in the same state (idempotency) is allowed.
 *
 * @param from - Current envelope status (validated against {@link EnvelopeStatusSchema}).
 * @param to - Target envelope status (validated against {@link EnvelopeStatusSchema}).
 * @throws {ConflictError} When the transition is not allowed.
 */
export const assertLifecycleTransition = (from: EnvelopeStatus, to: EnvelopeStatus): void => {
  const sFrom = EnvelopeStatusSchema.parse(from);
  const sTo = EnvelopeStatusSchema.parse(to);

  // Idempotent transitions are fine
  if (sFrom === sTo) return;

  // Forward-only transitions
  if (sFrom === "draft" && sTo === "sent") return;
  if (sFrom === "sent" && (sTo === "completed" || sTo === "canceled" || sTo === "declined")) return;

  throw new ConflictError(
    `Invalid envelope state transition from '${sFrom}' to '${sTo}'`,
    ErrorCodes.COMMON_CONFLICT,
    { from: sFrom, to: sTo }
  );
};

/**
 * Ensures an envelope is still in "draft" for structural mutations
 * (e.g., adding/removing documents or parties).
 *
 * @param env - Minimal view of an envelope containing its status and identifier.
 *              Note the key is `envelopeId` (not `id`).
 * @throws {ConflictError} When the envelope is not in "draft".
 */
export const assertDraft = (env: Pick<Envelope, "status" | "envelopeId">): void => {
  if (env.status !== "draft") {
    throw new ConflictError(
      `Envelope ${env.envelopeId} is not in draft state`,
      ErrorCodes.COMMON_CONFLICT,
      {
        envelopeId: env.envelopeId,
        status: env.status,
        required: "draft",
        reason: "Structural mutations are only allowed in draft state",
      }
    );
  }
};


