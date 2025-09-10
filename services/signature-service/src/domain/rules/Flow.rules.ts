/**
 * @file Flow.rules.ts
 * @summary Domain rules for envelope flow and invitation policies
 * @description Validates envelope readiness to send, party invitation
 * rate limits, and cooldown policies for envelope operations.
 */

import type { Party, Input } from "../entities";
import { BadRequestError, TooManyRequestsError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * Validates readiness to send an envelope.
 *
 * Requirements:
 * - At least one party with role "signer".
 * - At least one input.
 *
 * Throws a 400 Bad Request when requirements are not met.
 *
 * @param parties - Parties associated with the envelope.
 * @param inputs - Inputs associated with the envelope.
 * @throws {BadRequestError} When there is no signer or no inputs.
 */
export const assertReadyToSend = (
  parties: readonly Party[],
  inputs: readonly Input[]
): void => {
  const hasSigner = parties.some((p) => p.role === "signer");
  if (!hasSigner) {
    throw new BadRequestError("At least one signer is required");
  }
  if (inputs.length === 0) {
    throw new BadRequestError("No inputs defined");
  }
};

/**
 * Validates per-party invitation rate limits.
 *
 * Enforces:
 * - Minimum cooldown between invitations.
 * - Daily invitation cap.
 *
 * On violations, throws a domain-scoped 429 Too Many Requests with
 * `retryAfterSeconds` attached for transport layers.
 *
 * @param stats - Invitation metrics and policy configuration.
 * @param stats.lastSentAt - Epoch milliseconds of the last invitation sent to this party (optional).
 * @param stats.sentToday - Count of invitations sent today to this party.
 * @param stats.minCooldownMs - Minimum milliseconds required between invitations.
 * @param stats.dailyLimit - Maximum number of invitations allowed per day.
 * @throws {TooManyRequestsError} When cooldown has not elapsed or daily limit is reached.
 */
export const assertInvitePolicy = (stats: {
  lastSentAt?: number;
  sentToday: number;
  minCooldownMs: number;
  dailyLimit: number;
}): void => {
  const now = Date.now();

  if (typeof stats.lastSentAt === "number") {
    const elapsed = now - stats.lastSentAt;
    const remainingMs = stats.minCooldownMs - elapsed;
    if (remainingMs > 0) {
      const retryAfterSeconds = Math.ceil(remainingMs / 1000);
      throw new TooManyRequestsError(
        "Party invitation cooldown not elapsed",
        ErrorCodes.COMMON_TOO_MANY_REQUESTS,
        { retryAfterSeconds, reason: "cooldown" }
      );
    }
  }

  if (stats.sentToday >= stats.dailyLimit) {
    const retryAfterSeconds = 24 * 60 * 60;
    throw new TooManyRequestsError(
      "Daily party invitation limit reached",
      ErrorCodes.COMMON_TOO_MANY_REQUESTS,
      { retryAfterSeconds, reason: "daily_limit" }
    );
  }
};

